import { FC } from 'react';
import CardFieldsForm from '../CardFieldsForm';
import { Form } from './styles';

const CardOptionsForm: FC = () => (
  <Form as="form">
    <CardFieldsForm />
  </Form>
);

export default CardOptionsForm;
