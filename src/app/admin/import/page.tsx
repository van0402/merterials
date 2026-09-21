'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { IMPORTABLE_FIELDS, guessMapping } from '@/lib/import-mapping';
import { AdminPagination } from '@/components/admin/pagination';

interface DraftRow {
  id: string;
  companyName: string;
  contactName: string | null;
  phone: string;
  country: string;
  industryRaw: string | null;
}

type EditableField = 'companyName' | 'contactName' | 'phone' | 'country' | 'industryRaw';

function isSuspiciousPhone(phone: string) {
  return /^\d{9,}$/.test(phone.replace(/\s/g, ''));
}

const PAGE_SIZE = 20;

export default function AdminImportPage() {
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<{ id: string; field: EditableField } | null>(null);
  const [mappingStep, setMappingStep] = useState<{
    headers: string[];
    rawRows: Record<string, any>[];
    mapping: Record<string, string>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    fetch(`/api/admin/suppliers/drafts?page=${page}&pageSize=${PAGE_SIZE}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        setDrafts(data.drafts);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [page]);

  async function handleImportFile(file: File) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

    if (rawRows.length === 0) {
      toast.error('File không có dữ liệu');
      return;
    }

    const headers = Object.keys(rawRows[0]);
    setMappingStep({ headers, rawRows, mapping: guessMapping(headers) });
  }

  async function confirmMapping() {
    if (!mappingStep) return;
    const { rawRows, mapping } = mappingStep;

    const rows = rawRows
      .map((raw) => {
        const row: Record<string, string> = {};
        for (const [header, field] of Object.entries(mapping)) {
          if (!field) continue;
          const value = String(raw[header] ?? '').trim();
          if (value) row[field] = value;
        }
        return row;
      })
      .filter((r) => r.companyName && r.phone);

    if (rows.length === 0) {
      toast.error('Không có dòng nào đủ Tên công ty + SĐT sau khi gán cột');
      return;
    }

    const res = await fetch('/api/admin/suppliers/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });
    const data = await res.json();
    if (data.success) {
      const skippedText = data.skipped > 0 ? `, bỏ qua ${data.skipped} dòng trùng` : '';
      toast.success(`Đã thêm ${data.created} công ty vào danh sách chờ${skippedText}`);
      setMappingStep(null);
      setPage(1);
      load();
    } else {
      toast.error(data.error || 'Import thất bại');
    }
  }

  async function bulkAction(action: 'publish' | 'delete') {
    if (selectedIds.length === 0) return;
    const res = await fetch('/api/admin/sellers/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, action }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(
        action === 'publish'
          ? `Đã đăng ${data.updated} công ty · xem trong Quản lý thành viên`
          : `Đã xoá ${data.deleted} bản nháp`,
      );
      setSelectedIds([]);
      setPage(1);
      load();
    } else {
      toast.error(data.error || 'Thao tác thất bại');
    }
  }

  async function saveEdit(id: string, field: EditableField, value: string) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
    setEditing(null);
    const res = await fetch(`/api/admin/suppliers/drafts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    const data = await res.json();
    if (!data.success) {
      toast.error('Lưu thất bại, tải lại danh sách');
      load();
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Import doanh nghiệp</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tải file Excel để thêm doanh nghiệp, xem trước và sửa lỗi trước khi đăng công khai.
        </p>
      </div>

      <div className="rounded-2xl border-2 border-dashed bg-white p-8 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])}
        />
        <p className="text-sm font-semibold">Kéo thả file .xlsx vào đây</p>
        <p className="mt-1 text-xs text-muted-foreground">hoặc bấm nút bên dưới để chọn file từ máy</p>
        <Button className="mt-4" onClick={() => fileInputRef.current?.click()}>
          Chọn file Excel
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">
          Đang chờ xem trước{' '}
          <span className="ml-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] text-orange-600">{total}</span>
        </h2>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border bg-orange-50 px-4 py-2.5">
          <span className="text-sm font-semibold">{selectedIds.length} đã chọn</span>
          <Button size="sm" onClick={() => bulkAction('publish')}>Đăng lên trang</Button>
          <Button size="sm" variant="outline" className="border-red-200 text-red-600" onClick={() => bulkAction('delete')}>Xoá</Button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="bg-[#fafafa] text-left">
              <th className="w-8 border-b px-4 py-3">
                <input
                  type="checkbox"
                  checked={drafts.length > 0 && selectedIds.length === drafts.length}
                  onChange={(e) => setSelectedIds(e.target.checked ? drafts.map((d) => d.id) : [])}
                />
              </th>
              {['Doanh nghiệp', 'Người đại diện', 'Số điện thoại', 'Quốc gia', 'Ngành nghề'].map((h) => (
                <th key={h} className="border-b px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drafts.map((d) => (
              <tr key={d.id}>
                <td className="border-b px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(d.id)}
                    onChange={(e) =>
                      setSelectedIds((prev) => (e.target.checked ? [...prev, d.id] : prev.filter((id) => id !== d.id)))
                    }
                  />
                </td>
                <td className="border-b px-4 py-3 text-[12px]">{d.companyName}</td>
                <EditableCell
                  value={d.contactName || ''}
                  editing={editing?.id === d.id && editing.field === 'contactName'}
                  onOpen={() => setEditing({ id: d.id, field: 'contactName' })}
                  onSave={(v) => saveEdit(d.id, 'contactName', v)}
                />
                <td className="border-b px-4 py-3 text-[12px]">
                  {editing?.id === d.id && editing.field === 'phone' ? (
                    <input
                      autoFocus
                      defaultValue={d.phone}
                      className="w-full rounded border border-orange-400 px-1.5 py-0.5 text-[12px]"
                      onBlur={(e) => saveEdit(d.id, 'phone', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    />
                  ) : (
                    <span className="cursor-pointer" onClick={() => setEditing({ id: d.id, field: 'phone' })}>
                      {d.phone}
                      {isSuspiciousPhone(d.phone) && (
                        <span className="ml-1.5 text-[10px] font-bold text-amber-600">⚠ kiểm tra định dạng</span>
                      )}
                    </span>
                  )}
                </td>
                <EditableCell
                  value={d.country}
                  editing={editing?.id === d.id && editing.field === 'country'}
                  onOpen={() => setEditing({ id: d.id, field: 'country' })}
                  onSave={(v) => saveEdit(d.id, 'country', v)}
                />
                <td className="border-b px-4 py-3 text-[12px]">{d.industryRaw || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && drafts.length === 0 && (
          <div className="p-14 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu nào đang chờ import. Tải file lên để bắt đầu.
          </div>
        )}
        <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>

      {mappingStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold">Gán cột dữ liệu</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Hệ thống đã đoán sẵn — kiểm tra lại trước khi import {mappingStep.rawRows.length} dòng.
            </p>

            <div className="mt-5 space-y-3">
              {mappingStep.headers.map((header) => (
                <div key={header} className="flex items-center gap-3">
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[12px] font-semibold">{header}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      VD: {String(mappingStep.rawRows[0]?.[header] ?? '') || '—'}
                    </p>
                  </div>
                  <select
                    className="w-[180px] rounded-lg border px-2 py-1.5 text-[12px]"
                    value={mappingStep.mapping[header] ?? ''}
                    onChange={(e) =>
                      setMappingStep((prev) =>
                        prev ? { ...prev, mapping: { ...prev.mapping, [header]: e.target.value } } : prev,
                      )
                    }
                  >
                    <option value="">Bỏ qua</option>
                    {IMPORTABLE_FIELDS.map((f) => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setMappingStep(null)}>Huỷ</Button>
              <Button className="flex-1" onClick={confirmMapping}>
                Xác nhận, import {mappingStep.rawRows.length} dòng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditableCell({
  value,
  editing,
  onOpen,
  onSave,
}: {
  value: string;
  editing: boolean;
  onOpen: () => void;
  onSave: (value: string) => void;
}) {
  if (editing) {
    return (
      <td className="border-b px-4 py-3 text-[12px]">
        <input
          autoFocus
          defaultValue={value}
          className="w-full rounded border border-orange-400 px-1.5 py-0.5 text-[12px]"
          onBlur={(e) => onSave(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
      </td>
    );
  }
  return (
    <td className="cursor-pointer border-b px-4 py-3 text-[12px]" onClick={onOpen}>
      {value || '—'}
    </td>
  );
}