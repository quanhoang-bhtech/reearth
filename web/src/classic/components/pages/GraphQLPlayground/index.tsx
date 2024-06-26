import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { GraphiQL } from "graphiql";
import { useEffect, useState } from "react";

import Filled from "@reearth/classic/components/atoms/Filled";
import { useAuth } from "@reearth/services/auth";

const fetcher = createGraphiQLFetcher({
  url: `${window.REEARTH_CONFIG?.api || "/api"}/graphql`,
});

export default function GraphQLPlayground(_: { path?: string }): JSX.Element {
  const { getAccessToken } = useAuth();
  const [headers, setHeaders] = useState<string>();
  useEffect(() => {
    getAccessToken().then(a => {
      setHeaders(JSON.stringify({ Authorization: `Bearer ${a}` }, null, 2));
    });
  }, [getAccessToken]);

  return headers ? (
    <Filled>
      <GraphiQL fetcher={fetcher} isHeadersEditorEnabled headers={headers} />
    </Filled>
  ) : (
    <div>Please log in to Re:Earth</div>
  );
}
