import React from "react";

import Loading from "@reearth/classic/components/atoms/Loading";
import TreeView from "@reearth/classic/components/atoms/TreeView";
import { metricsSizes } from "@reearth/classic/theme";
import { useT } from "@reearth/services/i18n";
import { styled } from "@reearth/services/theme";

import useHooks, { Layer, TreeViewItem } from "./hooks";

export type { Format, Layer } from "./hooks";

export type Props = {
  rootLayerId?: string;
  selectedLayerId?: string;
  layers?: Layer[];
  selectedType?: "scene" | "layer" | "widgets" | "widget" | "cluster" | "dataset";
  loading?: boolean;
  onLayerVisibilityChange?: (id: string, visibility: boolean) => void;
  onLayerSelect?: (layerId: string, ...i: number[]) => void;
  onZoomToLayer?: (layerId: string) => void;
};

const LayerTreeView: React.FC<Props> = ({
  rootLayerId,
  selectedLayerId,
  selectedType,
  layers,
  onLayerVisibilityChange,
  onLayerSelect,
  onZoomToLayer,
  loading,
}) => {
  const t = useT();
  const {
    layersItem,
    select,
    LayerTreeViewItem,
    selected,
  } = useHooks({
    rootLayerId,
    layers,
    selectedLayerId,
    selectedType,
    onLayerSelect,
    onLayerVisibilityChange,
    onZoomToLayer,
  });
  
  return (
    <Wrapper>
      <ItemsGroupWrapper>
        {layersItem && (
          <TreeView<TreeViewItem, HTMLDivElement>
            item={layersItem}
            selected={selected}
            renderItem={LayerTreeViewItem}
            selectable
            expandable
            expanded={rootLayerId && !selectedLayerId ? [rootLayerId] : undefined}
            onSelect={select}
          />
        )}
        {loading && <Loading />}
      </ItemsGroupWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column;
`;

const OutlineItemsWrapper = styled.div`
  //margin-top: ${metricsSizes["4xl"]}px;
  position: relative;
  background-color: ${props => props.theme.classic.layers.bg};
`;

const ItemsGroupWrapper = styled(OutlineItemsWrapper)`
  min-height: 0;
`;

export default LayerTreeView;
