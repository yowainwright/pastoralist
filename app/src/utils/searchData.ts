import { getCollection } from "astro:content";

export async function getSearchData() {
  const docs = await getCollection("docs");

  const searchData = docs.map((doc) => {
    // Get the raw content from the MDX file
    const rawContent = doc.body || "";

    // Extract text content from MDX (simplified - you might want to improve this)
    let content = rawContent
      .replace(/---[\s\S]*?---/g, "") // Remove frontmatter
      .replace(/import[\s\S]*?from[\s\S]*?;/g, "") // Remove imports
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/`[^`]*`/g, ""); // Remove inline code
    // Remove HTML/JSX tags repeatedly until none remain
    let prevContent;
    do {
      prevContent = content;
      content = content.replace(/<[^>]*>/g, "");
    } while (content !== prevContent);
    content = content
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert links to text
      .replace(/[#*_~]/g, "") // Remove markdown formatting
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim()
      .substring(0, 500); // Limit content length

    return {
      title: doc.data.title,
      description: doc.data.description || "",
      content,
      slug: doc.slug,
    };
  });

  return searchData;
}
