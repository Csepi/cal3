import { Link, Navigate, useParams } from 'react-router-dom';
import { useMarketing, useMarketingMeta } from '../../hooks/useMarketing';

function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { blogPosts } = useMarketing();

  const post = blogPosts.find((item) => item.slug === slug);
  const fallbackTitle = 'PrimeCal Blog';
  const fallbackDescription = 'Browse practical guides on scheduling, booking, and automation.';
  useMarketingMeta(post?.title ?? fallbackTitle, post?.excerpt ?? fallbackDescription);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const relatedPosts = blogPosts
    .filter((candidate) => candidate.slug !== post.slug && candidate.category === post.category)
    .slice(0, 2);

  return (
    <article className="py-16 sm:py-20">
      <div className="marketing-container max-w-4xl">
        <Link to="/blog" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
          {'<- Back to blog'}
        </Link>
        <p className="mt-5 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
          {post.category}
        </p>
        <h1 className="marketing-display mt-4 text-4xl font-bold text-slate-900 sm:text-5xl">{post.title}</h1>
        <p className="mt-3 text-sm text-slate-500">
          {post.author} | {post.readTime} | {post.publishedAt}
        </p>

        <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          {post.content.map((paragraph) => (
            <p key={paragraph} className="text-slate-700">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Share on X
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Share on LinkedIn
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Copy link
          </button>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Related posts</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                to={`/blog/${related.slug}`}
                className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 transition hover:border-blue-300"
              >
                {related.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export default BlogPost;

