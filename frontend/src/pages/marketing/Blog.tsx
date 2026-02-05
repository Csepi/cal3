import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarketing, useMarketingMeta } from '../../hooks/useMarketing';

function Blog() {
  const { blogPosts, blogCategories } = useMarketing();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useMarketingMeta(
    'PrimeCal Blog',
    'Guides on calendar operations, booking automation, and scaling schedule-driven teams.',
  );

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return blogPosts.filter((post) => {
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        post.title.toLowerCase().includes(normalizedQuery) ||
        post.excerpt.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, blogPosts, query]);

  return (
    <section className="py-16 sm:py-20">
      <div className="marketing-container">
        <p className="marketing-pill">PrimeCal blog</p>
        <h1 className="marketing-display mt-4 text-4xl font-bold text-slate-900 sm:text-5xl">
          Practical playbooks for schedule-driven teams
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Learn how teams use PrimeCal to reduce operational drag, scale booking workflows, and build reliable
          automation systems.
        </p>

        <div className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto]">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search posts..."
            className="marketing-input"
          />
          <div className="flex flex-wrap gap-2">
            {blogCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-3 py-2 text-sm font-semibold ${
                  category === activeCategory ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredPosts.map((post) => (
            <article key={post.slug} className="marketing-card rounded-2xl p-5">
              <div className="mb-4 rounded-xl bg-gradient-to-br from-blue-100 via-indigo-100 to-emerald-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                {post.category}
              </div>
              <h2 className="text-xl font-semibold text-slate-900">{post.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
              <p className="mt-3 text-xs text-slate-500">
                {post.author} | {post.readTime}
              </p>
              <Link to={`/blog/${post.slug}`} className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900">
                {'Read article ->'}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Blog;

