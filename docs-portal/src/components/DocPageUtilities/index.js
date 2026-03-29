import React, { useEffect, useMemo, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation } from '@docusaurus/router';

const FONT_SIZES = ['small', 'medium', 'large'];

function setFontSize(size) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-doc-font-size', size);
  localStorage.setItem('pc-doc-font-size', size);
}

function getFontSize() {
  if (typeof window === 'undefined') return 'medium';
  return localStorage.getItem('pc-doc-font-size') || 'medium';
}

export default function DocPageUtilities() {
  const { siteConfig } = useDocusaurusContext();
  const location = useLocation();
  const [fontSize, updateFontSize] = useState('medium');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const stored = getFontSize();
    updateFontSize(stored);
    setFontSize(stored);
  }, []);

  const absoluteUrl = useMemo(() => {
    if (typeof window !== 'undefined') return window.location.href;
    return `${siteConfig.url}${location.pathname}`;
  }, [location.pathname, siteConfig.url]);

  const copyLink = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    await navigator.clipboard.writeText(absoluteUrl);
  };

  const emailLink = () => {
    const subject = encodeURIComponent('PrimeCal Documentation');
    const body = encodeURIComponent(`Useful documentation link:\\n\\n${absoluteUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const printPage = () => {
    window.print();
  };

  const chooseFeedback = (value) => {
    setFeedback(value);
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'docs_feedback', {
        feedback: value,
        page_path: location.pathname,
      });
    }
  };

  return (
    <div className="pc-doc-tools">
      <div className="pc-doc-tools__group">
        <button type="button" onClick={copyLink}>
          Copy Link
        </button>
        <button type="button" onClick={emailLink}>
          Email Link
        </button>
        <button type="button" onClick={printPage}>
          Export PDF
        </button>
      </div>
      <div className="pc-doc-tools__group">
        {FONT_SIZES.map((size) => (
          <button
            type="button"
            key={size}
            className={fontSize === size ? 'is-active' : ''}
            onClick={() => {
              updateFontSize(size);
              setFontSize(size);
            }}
          >
            {size === 'small' ? 'A-' : size === 'large' ? 'A+' : 'A'}
          </button>
        ))}
      </div>
      <div className="pc-doc-tools__group">
        <span>Was this helpful?</span>
        <button
          type="button"
          className={feedback === 'yes' ? 'is-active' : ''}
          onClick={() => chooseFeedback('yes')}
        >
          Yes
        </button>
        <button
          type="button"
          className={feedback === 'no' ? 'is-active' : ''}
          onClick={() => chooseFeedback('no')}
        >
          No
        </button>
      </div>
      <button
        className="pc-back-to-top"
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        Back to Top
      </button>
    </div>
  );
}
