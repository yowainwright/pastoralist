import React, { useEffect } from "react";
import docsearch from "@docsearch/js";
import "@docsearch/css";

function DocSearchReact({ algoliaDocsearchConfig }) {
  useEffect(() => {
    docsearch(algoliaDocsearchConfig);
  }, []);

  return <div id="docsearch"></div>;
}

export default DocSearchReact;
