import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* SEO Meta Tags */}
        <meta name="description" content="Transform your resume with AI-powered analysis and professional LaTeX generation. Get actionable feedback, ATS optimization, and interview-ready templates trusted by top tech companies." />
        <meta name="keywords" content="resume builder, CV maker, LaTeX resume, ATS resume, AI resume analysis, professional resume, tech resume, FAANG resume, resume optimization, resume feedback, resume templates, career tools" />
        <meta name="author" content="Resumify AI" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="en" />
        <meta name="revisit-after" content="7 days" />
        <link rel="canonical" href="https://resumify-peach.vercel.app/" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Resumify AI - Transform Your Resume with AI-Powered Analysis" />
        <meta property="og:description" content="Get expert resume feedback and professional LaTeX templates. Used by professionals at top tech companies. ATS-optimized, interview-ready results." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://resumify-peach.vercel.app/" />
        <meta property="og:site_name" content="Resumify AI" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Resumify AI - Transform Your Resume with AI" />
        <meta name="twitter:description" content="AI-powered resume analysis and LaTeX generation. Get actionable feedback and professional templates trusted by top tech companies." />
        <meta name="twitter:creator" content="@resumifyai" />
        
        {/* Additional SEO */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="application-name" content="Resumify AI" />
        <meta name="apple-mobile-web-app-title" content="Resumify AI" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Resumify AI",
              "description": "AI-powered resume analysis and LaTeX generation tool that helps professionals create interview-ready resumes with expert feedback and ATS optimization.",
              "url": "https://resumify-peach.vercel.app/",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "creator": {
                "@type": "Organization",
                "name": "Resumify AI"
              },
              "featureList": [
                "AI-powered resume analysis",
                "LaTeX template generation",
                "ATS optimization",
                "Professional feedback",
                "Multiple resume templates",
                "Real-time analysis"
              ]
            })
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}