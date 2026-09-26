import {
  ContentPasteSearch as ClipboardIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import {
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputAdornment,
  Typography,
} from '@mui/material';
import { Box } from '@mui/system';
import {
  ChangeEvent,
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { maxFileSize } from 'src/constants';
import Label from '../Label';
import { ButtonLabel } from './styles';
import { FileUploaderProps } from './types';

const FileUploader: FC<FileUploaderProps> = ({
  slug,
  label,
  buttonText,
  onChange,
  file,
  tooltipProps,
}) => {
  const fileReader = useRef<FileReader>();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    if (!file) setFileName(undefined);
  }, [file]);

  const upload = useCallback((uploadedFile: File) => {
    if (uploadedFile.size > maxFileSize) {
      setErrorMessage('Please upload a file smaller than 5 MB');
      return;
    }
    setLoading(true);

    // Read as dataURL so we don't have to use local blobs, blobs don't work with html-to-canvas
    fileReader.current?.readAsDataURL(uploadedFile);
    setFileName(uploadedFile.name);
  }, []);

  const onFileSystemUpload = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setErrorMessage(undefined);

      const uploadedFile = e.currentTarget.files?.[0];
      if (!uploadedFile) return;
      upload(uploadedFile);
      e.currentTarget.value = '';
    },
    [upload],
  );

  const onClipboardUpload = useCallback(async () => {
    setErrorMessage(undefined);

    const permission = await navigator.permissions.query({
      // @ts-expect-error - Types are wrong
      name: 'clipboard-read',
    });
    if (permission.state === 'denied') {
      return setErrorMessage('Permission to read your clipboard was denied');
    }

    const clipboardContents = await navigator.clipboard.read();
    if (!clipboardContents?.[0]?.types?.includes('image/png')) {
      return setErrorMessage(
        'Please copy an image to your clipboard to upload it',
      );
    }

    const blob = await clipboardContents[0].getType('image/png');
    return upload(new File([blob], 'Clipboard.png'));
  }, [upload]);

  // Subscribe to FileReader results and call the onChange when a result comes in
  useEffect(() => {
    if (!fileReader.current) {
      fileReader.current = new FileReader();
    }

    const successCallback = () => {
      const result = fileReader.current?.result;
      if (typeof result !== 'string') return;

      setLoading(false);
      onChange(fileName || 'My image', result);
    };

    const errorCallback = () => {
      setLoading(false);
    };

    fileReader.current?.addEventListener('load', successCallback);
    fileReader.current?.addEventListener('error', errorCallback);

    return () => {
      fileReader.current?.removeEventListener('load', successCallback);
      fileReader.current?.removeEventListener('error', errorCallback);
    };
  }, [onChange, fileName]);

  return (
    <FormControl error={!!errorMessage}>
      <Label slug={slug} tooltipProps={tooltipProps}>
        {label}
      </Label>
      <Box display="flex" gap={0.5}>
        <Button
          sx={theme => ({
            borderColor: theme.custom.inputBorderColor,
            textTransform: 'none',
            flexGrow: 1,
          })}
          variant="outlined"
          color="inherit"
          component="label"
          startIcon={
            isLoading ? (
              <CircularProgress color="inherit" size={20} />
            ) : (
              <UploadFileIcon />
            )
          }
          endIcon={
            !buttonText && !!fileName ? (
              <InputAdornment position="end">
                <Typography variant="subtitle2">&lt; 5 MB</Typography>
              </InputAdornment>
            ) : undefined
          }
        >
          <ButtonLabel>{buttonText || (fileName ?? <>&nbsp;</>)}</ButtonLabel>
          <input
            id={`${slug}-input`}
            accept="image/*"
            type="file"
            hidden
            onChange={onFileSystemUpload}
          />
        </Button>
        <Button
          title="Paste image from clipboard"
          onClick={onClipboardUpload}
          variant="outlined"
          color="inherit"
          sx={theme => ({
            borderColor: theme.custom.inputBorderColor,
            px: 2.5,
            minWidth: 0,
          })}
        >
          <ClipboardIcon fontSize="small" />
        </Button>
      </Box>
      {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
    </FormControl>
  );
};

export default FileUploader;
