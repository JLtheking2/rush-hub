import AccordionForm from '@components/AccordionForm';
import FileUploader from '@components/inputs/FileUploader';
import { useRushCardStore } from '@cardEditor/card/store';
import { FC, useState } from 'react';
import { Typography } from '@mui/material';
import ImgItem from './components/ImgItem';
import WebSearch from './components/WebSearch';

const ImagesForm: FC = () => {
  const image = useRushCardStore(state => state.card.image);
  const setCard = useRushCardStore(state => state.setCard);
  const [fileName, setFileName] = useState('Card art');

  return (
    <AccordionForm slug="imagesForm" header="Image">
      <WebSearch />
      <FileUploader
        label="Upload Image"
        slug="imgUpload"
        buttonText={
          <Typography variant="body2" component="span">
            {image ? 'Click to replace your image' : 'Click to add your image'}
          </Typography>
        }
        onChange={(name, src) => {
          setFileName(name);
          setCard({ image: { src } });
        }}
      />
      {image && <ImgItem key={image.src} img={image} name={fileName} />}
    </AccordionForm>
  );
};

export default ImagesForm;
