import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="AI-powered resume analysis and LaTeX generation tool" />
        <meta name="keywords" content="resume, CV, LaTeX, AI, analysis, generator, professional" />
        <meta name="author" content="Resumify AI" />
        <meta property="og:title" content="Resumify AI - Transform Your Resume" />
        <meta property="og:description" content="AI-powered resume analysis and LaTeX generation tool" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Resumify AI - Transform Your Resume" />
        <meta name="twitter:description" content="AI-powered resume analysis and LaTeX generation tool" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}