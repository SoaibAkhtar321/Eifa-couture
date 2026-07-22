'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import DataTable, { type DataTableColumn } from '@/components/admin/DataTable';
import { TextField } from '@/components/admin/FormField';
import {
  getAssignedProducts,
  searchAssignableProducts,
  assignProductToCollection,
  removeProductFromCollection,
  type AssignedProduct,
  type ProductSearchResult,
} from '@/lib/admin/collection-products';

interface CollectionProductsManagerProps {
  collectionId: string;
}

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-charcoal/10 text-charcoal/50'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function ProductThumbnail({ url, name }: { url: string | null; name: string }) {
  return (
    <div className="h-12 w-12 overflow-hidden rounded-md bg-beige/60">
      {url ? <Image src={url} alt={name} width={48} height={48} className="h-full w-full object-cover" /> : null}
    </div>
  );
}

export default function CollectionProductsManager({ collectionId }: CollectionProductsManagerProps) {
  const [assigned, setAssigned] = useState<AssignedProduct[]>([]);
  const [isLoadingAssigned, setIsLoadingAssigned] = useState(true);
  const [assignedError, setAssignedError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  async function loadAssigned() {
    setIsLoadingAssigned(true);
    setAssignedError(null);
    const { data, error } = await getAssignedProducts(collectionId);
    setIsLoadingAssigned(false);
    if (error) {
      setAssignedError(error);
      return;
    }
    setAssigned(data ?? []);
  }

  useEffect(() => {
    const init = async () => {
      await loadAssigned();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId]);

  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      setIsSearching(true);
      setSearchError(null);
      const excludeIds = assigned.map((row) => row.product_id);
      const { data, error } = await searchAssignableProducts(debouncedQuery, excludeIds);
      if (cancelled) return;
      setIsSearching(false);
      if (error) {
        setSearchError(error);
        return;
      }
      setSearchResults(data ?? []);
    }

    runSearch();
    return () => {
      cancelled = true;
    };
    // Re-run whenever the query changes, or the assigned set changes
    // (so a just-added product immediately drops out of the results).
  }, [debouncedQuery, assigned]);

  async function handleAdd(productId: string) {
    setAddingId(productId);
    setAddError(null);
    const { error } = await assignProductToCollection(collectionId, productId);
    setAddingId(null);
    if (error) {
      setAddError(error);
      return;
    }
    await loadAssigned();
  }

  async function handleRemove(productId: string) {
    setRemovingId(productId);
    setAssignedError(null);
    const { error } = await removeProductFromCollection(collectionId, productId);
    setRemovingId(null);
    if (error) {
      setAssignedError(error);
      return;
    }
    await loadAssigned();
  }

  const assignedColumns: DataTableColumn<AssignedProduct>[] = [
    {
      key: 'thumbnail',
      header: '',
      className: 'w-16',
      render: (row) => <ProductThumbnail url={row.product.primary_image_url} name={row.product.name} />,
    },
    {
      key: 'name',
      header: 'Product',
      render: (row) => (
        <div>
          <p className="font-medium text-charcoal">{row.product.name}</p>
          <p className="text-xs text-charcoal/50">{row.product.slug}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge isActive={row.product.is_active} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28 text-right',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleRemove(row.product_id)}
          disabled={removingId === row.product_id}
          className="rounded-md border border-charcoal/15 px-3 py-1.5 text-xs font-medium text-charcoal transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
        >
          {removingId === row.product_id ? 'Removing…' : 'Remove'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-charcoal">Assigned products</h2>
          <p className="text-xs text-charcoal/50">Products currently in this collection.</p>
        </div>

        <DataTable
          columns={assignedColumns}
          rows={assigned}
          getRowKey={(row) => row.product_id}
          isLoading={isLoadingAssigned}
          error={assignedError}
          emptyMessage="No products assigned yet."
        />
      </div>

      <div className="rounded-lg border border-charcoal/10 bg-ivory p-6 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-charcoal">Add products</h2>
          <p className="text-xs text-charcoal/50">Search by name to add a product to this collection.</p>
        </div>

        <TextField
          label="Search products"
          placeholder="Search by name or slug…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {addError && <p className="text-xs text-red-600">{addError}</p>}

        <div className="rounded-lg border border-charcoal/10 overflow-hidden">
          {isSearching ? (
            <div className="p-6 text-center text-sm text-charcoal/50">Searching…</div>
          ) : searchError ? (
            <div className="p-6 text-center text-sm text-red-600">{searchError}</div>
          ) : searchResults.length === 0 ? (
            <div className="p-6 text-center text-sm text-charcoal/50">
              {searchQuery.trim() ? 'No matching products found.' : 'Start typing to search products.'}
            </div>
          ) : (
            <ul className="divide-y divide-charcoal/5">
              {searchResults.map((product) => (
                <li key={product.id} className="flex items-center gap-3 px-4 py-3">
                  <ProductThumbnail url={product.primary_image_url} name={product.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-charcoal">{product.name}</p>
                    <p className="truncate text-xs text-charcoal/50">{product.slug}</p>
                  </div>
                  <StatusBadge isActive={product.is_active} />
                  <button
                    type="button"
                    onClick={() => handleAdd(product.id)}
                    disabled={addingId === product.id}
                    className="shrink-0 rounded-md bg-maroon px-3 py-1.5 text-xs font-medium text-ivory transition hover:bg-maroon/90 disabled:opacity-50"
                  >
                    {addingId === product.id ? 'Adding…' : 'Add'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
