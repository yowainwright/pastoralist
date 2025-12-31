export interface PaginationItem {
  title: string;
  href: string;
}

export interface PaginationProps {
  prevItem?: PaginationItem;
  nextItem?: PaginationItem;
}
