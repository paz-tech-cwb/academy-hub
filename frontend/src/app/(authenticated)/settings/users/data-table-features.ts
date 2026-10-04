import { rowPaginationFeature, tableFeatures } from '@tanstack/react-table';

export type UsersTableColumnMeta = {
  width?: number;
  className?: string;
};

export const features = tableFeatures({
  rowPaginationFeature,
  columnMeta: {} as UsersTableColumnMeta,
});

export type UsersTableFeatures = typeof features;
