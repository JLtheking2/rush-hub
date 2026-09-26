import { FC } from 'react';
import CardFieldsForm from '../CardFieldsForm';
import ImagesForm from '../ImagesForm';
import { Form } from './styles';

const CardOptionsForm: FC = () => (
  <Form as="form">
    <ImagesForm />
    <CardFieldsForm />
  </Form>
);

export default CardOptionsForm;
