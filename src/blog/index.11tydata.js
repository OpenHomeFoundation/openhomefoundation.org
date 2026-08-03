const { postsPerPage } = require("../../_data/blog.js");

// Builds a windowed page list for the pagination nav: first two pages,
// last two pages, and the pages immediately around the current one,
// with `null` markers standing in for the "..." gaps between them.
function buildPaginationNav(pagination) {
  const totalPages = pagination.hrefs.length;
  const currentPage = pagination.pageNumber + 1;

  const pageNumbers = new Set(
    [1, 2, currentPage - 1, currentPage, currentPage + 1, totalPages - 1, totalPages].filter(
      (page) => page >= 1 && page <= totalPages
    )
  );
  const sortedPages = [...pageNumbers].sort((a, b) => a - b);

  const nav = [];
  let previousPage = null;
  for (const page of sortedPages) {
    if (previousPage !== null && page - previousPage > 1) {
      nav.push({ ellipsis: true });
    }
    nav.push({
      number: page,
      href: pagination.hrefs[page - 1],
      current: page === currentPage,
    });
    previousPage = page;
  }
  return nav;
}

module.exports = {
  pagination: {
    data: "collections.posts",
    size: postsPerPage,
  },
  permalink: (data) => {
    const pageNumber = data.pagination.pageNumber;
    return pageNumber === 0 ? "/blog/" : `/blog/posts/${pageNumber + 1}/`;
  },
  eleventyComputed: {
    paginationNav: (data) => (data.pagination ? buildPaginationNav(data.pagination) : null),
    canonical_url: () => "/blog/",
  },
};
