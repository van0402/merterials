'use client';

import { FormEvent, useMemo, useState } from 'react';

type SupplierStatus = 'active' | 'inactive';

type Supplier = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: SupplierStatus;
};

const initialSuppliers: Supplier[] = [
  { id: 1, name: 'Công ty ABC', email: 'abc@demo.com', phone: '0901112233', status: 'active' },
  { id: 2, name: 'Công ty XYZ', email: 'xyz@demo.com', phone: '0904445566', status: 'inactive' },
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active' as SupplierStatus,
  });

  const totalActive = useMemo(
    () => suppliers.filter((item) => item.status === 'active').length,
    [suppliers]
  );

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!name || !email || !phone) {
      alert('Vui lòng nhập đầy đủ thông tin công ty!');
      return;
    }

    const newSupplier: Supplier = {
      id: Date.now(),
      name,
      email,
      phone,
      status: form.status,
    };

    setSuppliers((prev) => [newSupplier, ...prev]);
    setForm({
      name: '',
      email: '',
      phone: '',
      status: 'active',
    });
  };

  return (
    <div style={{ padding: 24, fontFamily: 'Arial, sans-serif', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 20 }}>Quản lý nhà cung cấp</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: '#f3f4f6',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #e5e7eb',
          }}
        >
          <div style={{ color: '#6b7280', fontSize: 14 }}>Tổng công ty</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{suppliers.length}</div>
        </div>

        <div
          style={{
            background: '#ecfdf5',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #a7f3d0',
          }}
        >
          <div style={{ color: '#065f46', fontSize: 14 }}>Đang hoạt động</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totalActive}</div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Thêm công ty</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Tên công ty</label>
            <input
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nhập tên công ty"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="example@company.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Số điện thoại</label>
            <input
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="090..."
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              style={inputStyle}
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            type="submit"
            style={{
              padding: '10px 18px',
              border: 'none',
              borderRadius: 8,
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Thêm công ty
          </button>
        </div>
      </form>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={thStyle}>Tên</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Số điện thoại</th>
              <th style={thStyle}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={tdStyle}>{supplier.name}</td>
                <td style={tdStyle}>{supplier.email}</td>
                <td style={tdStyle}>{supplier.phone}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: supplier.status === 'active' ? '#dcfce7' : '#f3f4f6',
                      color: supplier.status === 'active' ? '#166534' : '#374151',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {supplier.status === 'active' ? 'Hoạt động' : 'Ngừng'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  outline: 'none',
  boxSizing: 'border-box',
  fontSize: 14,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  fontSize: 14,
  color: '#374151',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 14,
  color: '#111827',
};