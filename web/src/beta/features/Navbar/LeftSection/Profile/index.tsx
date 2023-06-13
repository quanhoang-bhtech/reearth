import React, { useRef } from "react";

import Avatar from "@reearth/beta/components/Avatar";
import Dropdown, { Ref as DropDownRef } from "@reearth/beta/components/Dropdown";
import Text from "@reearth/beta/components/Text";
import {
  MenuList,
  MenuListItem,
  MenuListItemLabel,
} from "@reearth/beta/features/Navbar/Menus/MenuList";
import WorkspaceMenu from "@reearth/beta/features/Navbar/Menus/WorkspaceMenu";
import { useT } from "@reearth/services/i18n";
import { styled, useTheme } from "@reearth/services/theme";

import { User, Workspace } from "../../types";

export type LoginProps = {
  user: User;
  currentWorkspace: Workspace;
  personalWorkspace?: boolean;
};
export type Props = {
  workspaces?: Workspace[];
  personalWorkspace?: boolean;
  onSignOut: () => void;
  onWorkspaceChange?: (workspaceId: string) => void;
  openModal?: () => void;
};

const Label: React.FC<LoginProps> = ({ user, currentWorkspace }) => {
  const theme = useTheme();
  return (
    <LabelWrapper>
      <LabelLeft>
        <Avatar color={theme.main.avatarBg} innerText={user.name} boarderRadius="4px" />
      </LabelLeft>
      <LabelRight>
        <LabelWorkspaceName size="m" color={theme.main.weak}>
          {currentWorkspace.name}
        </LabelWorkspaceName>
      </LabelRight>
    </LabelWrapper>
  );
};

const HeaderProfile: React.FC<Props & Partial<LoginProps>> = ({
  user = { name: "" },
  currentWorkspace = { id: undefined, name: "" },
  personalWorkspace,
  workspaces = [],
  onSignOut,
  onWorkspaceChange,
  openModal,
}) => {
  const t = useT();

  const dropDownRef = useRef<DropDownRef>(null);

  return (
    <Wrapper>
      <StyledDropdown
        ref={dropDownRef}
        openOnClick
        noHoverStyle
        direction="down"
        hasIcon
        label={
          <Label
            user={user}
            personalWorkspace={personalWorkspace}
            currentWorkspace={currentWorkspace}
          />
        }>
        <ChildrenWrapper>
          <MenuList>
            <MenuListItem>
              <MenuListItemLabel linkTo={`/settings/account`} text={t("Account Settings")} />
            </MenuListItem>
            <MenuListItem noHover>
              <WorkspaceMenu
                currentWorkspace={currentWorkspace}
                workspaces={workspaces}
                onWorkspaceChange={onWorkspaceChange}
                openModal={openModal}
              />
            </MenuListItem>
            <MenuListItem>
              <MenuListItemLabel icon="logout" onClick={onSignOut} text={t("Log out")} />
            </MenuListItem>
            <MenuListItem>
              <MenuListItemLabel text={`v${__APP_VERSION__}`} />
            </MenuListItem>
          </MenuList>
        </ChildrenWrapper>
      </StyledDropdown>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  cursor: pointer;
  height: 100%;
`;

const StyledDropdown = styled(Dropdown)`
  padding: 0 24px;
`;

const ChildrenWrapper = styled.div`
  width: 230px;
  background-color: ${({ theme }) => theme.header.bg};
  padding: 0;
`;

const LabelWrapper = styled.div`
  display: flex;
  height: 100%;
  padding-left: 10px;
`;

const LabelRight = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const LabelLeft = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-right: 16px;
`;

const LabelWorkspaceName = styled(Text)`
  text-align: center;
  margin-top: 2px;
  font-weight: 700;
  line-height: 22px;
`;

export default HeaderProfile;