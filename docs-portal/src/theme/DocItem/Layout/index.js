import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import DocPageUtilities from '@site/src/components/DocPageUtilities';

export default function LayoutWrapper(props) {
  return (
    <>
      <DocPageUtilities />
      <Layout {...props} />
    </>
  );
}
