import { templateList } from '@cardEditor/card/templates';
import { useRushCardStore } from '@cardEditor/card/store';
import Label from '@components/inputs/Label';
import { ToggleButton, Typography } from '@mui/material';
import { FC } from 'react';
import { Grid, Swatch } from './styles';

const TemplatePicker: FC = () => {
  const template = useRushCardStore(state => state.card.template);
  const setTemplate = useRushCardStore(state => state.setTemplate);

  return (
    <div>
      <Label slug="template">Template</Label>
      <Grid role="group" aria-label="Template" id="template-input">
        {templateList.map(t => (
          <ToggleButton
            key={t.id}
            value={t.id}
            selected={t.id === template}
            onChange={() => setTemplate(t.id)}
            aria-label={t.label}
            data-template={t.id}
            size="small"
          >
            <Swatch $color={t.swatch} />
            <Typography variant="body2" component="span">
              {t.label}
            </Typography>
          </ToggleButton>
        ))}
      </Grid>
    </div>
  );
};

export default TemplatePicker;
