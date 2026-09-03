import { generateStaticParamsFor, importPage } from "nextra/pages";
import { useMDXComponents as getMDXComponents } from "../../mdx-components";

export const generateStaticParams = generateStaticParamsFor("mdxPath");

export async function generateMetadata({ params }) {
  const { metadata } = await importPage((await params).mdxPath);
  return metadata;
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page({ params, ...props }) {
  const resolvedParams = await params;
  const { default: MDXContent, toc, metadata, sourceCode } = await importPage(
    resolvedParams.mdxPath,
  );

  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={resolvedParams} />
    </Wrapper>
  );
}
