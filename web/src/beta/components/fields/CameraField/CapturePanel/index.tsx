import { useMemo } from "react";

import Button from "@reearth/beta/components/Button";
import NumberInput from "@reearth/beta/components/fields/common/NumberInput";
import Text from "@reearth/beta/components/Text";
import { Camera } from "@reearth/beta/utils/value";
import { useT } from "@reearth/services/i18n";
import { styled } from "@reearth/services/theme";

import PanelCommon from "../../common/PanelCommon";
import type { RowType } from "../types";

type Props = {
  camera?: Camera;
  onSave: (value?: Camera) => void;
  onClose: () => void;
};

const CapturePanel: React.FC<Props> = ({ camera, onSave, onClose }) => {
  const t = useT();

  const panelContent: { [key: string]: RowType } = useMemo(() => {
    return {
      [t("Current Position")]: [
        { id: "lat", description: t("Latitude") },
        { id: "lng", description: t("Longitude") },
        { id: "height", description: t("Height") },
      ],
      [t("Current Rotation")]: [
        { id: "heading", description: t("Heading") },
        { id: "pitch", description: t("Pitch") },
        { id: "roll", description: t("Roll") },
      ],
    };
  }, [t]);

  return (
    <PanelCommon title={t("Camera Position Editor")} onClose={onClose}>
      {Object.keys(panelContent).map(group => (
        <FieldGroup key={group}>
          <Text size="footnote">{group}</Text>
          <InputWrapper>
            {panelContent[group].map(field => (
              <StyledNumberInput
                key={field.id}
                inputDescription={field.description}
                value={camera?.[field.id]}
                disabled
              />
            ))}
          </InputWrapper>
        </FieldGroup>
      ))}
      <Divider />
      <ButtonWrapper>
        <StyledButton text={t("Cancel")} size="small" onClick={onClose} />
        <StyledButton
          text={t("Capture")}
          size="small"
          buttonType="primary"
          onClick={() => onSave(camera)}
        />
      </ButtonWrapper>
    </PanelCommon>
  );
};

export default CapturePanel;

const FieldGroup = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 4px;
`;

const Divider = styled.div`
  border-top: 1px solid ${({ theme }) => theme.outline.weak};
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px;
`;

const StyledButton = styled(Button)`
  flex: 1;
`;

const StyledNumberInput = styled(NumberInput)`
  flex: 1;
`;
