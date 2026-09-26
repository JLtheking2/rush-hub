import { FC, useState } from 'react';
import ImagesForm from '../ImagesForm';
import ImportExport from '../ImportExport';
import { Form } from './styles';

const CardOptionsForm: FC = () => {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(
    null,
  );
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);

  return (
    <Form as="form">
      <ImportExport
        fileHandle={fileHandle}
        setFileHandle={setFileHandle}
        directoryHandle={directoryHandle}
        setDirectoryHandle={setDirectoryHandle}
      />
      <ImagesForm />
    </Form>
  );
};

export default CardOptionsForm;
