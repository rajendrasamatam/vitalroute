import React, { useState } from 'react';
import { Package, Plus, Minus, AlertCircle, ShoppingCart, RefreshCw } from 'lucide-react';

const SupplyItem = ({ item, onUpdate }) => {
    const isLow = item.current <= item.min;

    return (
        <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: isLow ? '1px solid #fecaca' : '1px solid #f3f4f6',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                    width: 48, height: 48, borderRadius: '8px',
                    background: isLow ? '#fef2f2' : '#eff6ff',
                    color: isLow ? '#ef4444' : '#3b82f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Package size={24} />
                </div>
                <div>
                    <div style={{ color: '#1f2937', fontWeight: '600', fontSize: '1rem' }}>{item.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Unit: {item.unit}</div>
                </div>
                {isLow && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        color: '#ef4444', fontSize: '0.75rem', fontWeight: '700',
                        background: '#fef2f2', padding: '4px 8px', borderRadius: '4px'
                    }}>
                        <AlertCircle size={12} /> LOW STOCK
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', background: '#f9fafb',
                    borderRadius: '8px', padding: '4px', border: '1px solid #e5e7eb'
                }}>
                    <button
                        onClick={() => onUpdate(item.id, -1)}
                        style={{
                            width: 32, height: 32, borderRadius: '6px', border: 'none',
                            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#374151', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        <Minus size={16} />
                    </button>
                    <div style={{ width: 40, textAlign: 'center', fontWeight: '700', color: '#111' }}>
                        {item.current}
                    </div>
                    <button
                        onClick={() => onUpdate(item.id, 1)}
                        style={{
                            width: 32, height: 32, borderRadius: '6px', border: 'none',
                            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#3b82f6', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const MedicalSupplies = () => {
    const [supplies, setSupplies] = useState([
        { id: 1, name: 'Oxygen Cylinders (Portable)', current: 2, min: 2, unit: 'Tank' },
        { id: 2, name: 'Defibrillator Pads', current: 4, min: 3, unit: 'Pair' },
        { id: 3, name: 'Epinephrine Auto-injectors', current: 1, min: 4, unit: 'Kit' },
        { id: 4, name: 'Sterile Bandages (L)', current: 12, min: 10, unit: 'Box' },
        { id: 5, name: 'IV Saline Solution', current: 8, min: 5, unit: 'Bag' },
        { id: 6, name: 'Nitrile Gloves', current: 45, min: 20, unit: 'Pair' },
    ]);

    const handleUpdate = (id, change) => {
        setSupplies(prev => prev.map(item => {
            if (item.id === id) {
                const newVal = Math.max(0, item.current + change);
                return { ...item, current: newVal };
            }
            return item;
        }));
    };

    const lowStockCount = supplies.filter(s => s.current <= s.min).length;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            <div style={{
                marginBottom: '30px', background: '#3b82f6', borderRadius: '16px', padding: '30px',
                color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>Inventory Management</h2>
                    <p style={{ opacity: 0.9, marginTop: '5px' }}>Unit #42 Standard Loadout Check</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{Math.floor((supplies.filter(s => s.current > s.min).length / supplies.length) * 100)}%</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.8, textTransform: 'uppercase' }}>Readiness</div>
                </div>
            </div>

            {lowStockCount > 0 && (
                <div style={{
                    background: '#fff1f2', border: '1px solid #fda4af', borderRadius: '12px', padding: '16px',
                    marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', color: '#9f1239'
                }}>
                    <div style={{
                        width: 40, height: 40, background: '#fecaca', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <AlertTriangle size={20} color="#dc2626" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700' }}>Action Required</div>
                        <div style={{ fontSize: '0.9rem' }}>{lowStockCount} items are below critical stock levels. Please restock before next dispatch.</div>
                    </div>
                    <button style={{
                        background: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px',
                        cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <RefreshCw size={16} /> RESTOCK
                    </button>
                </div>
            )}

            <div style={{ display: 'grid', gap: '12px' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', marginLeft: '4px' }}>
                    Critical Consumables
                </h3>
                {supplies.map(item => (
                    <SupplyItem key={item.id} item={item} onUpdate={handleUpdate} />
                ))}
            </div>

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <button style={{
                    background: 'transparent', border: '1px dashed #d1d5db', color: '#6b7280',
                    padding: '12px 24px', borderRadius: '8px', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '8px'
                }}>
                    <Plus size={16} /> Add Custom Item (Admin Only)
                </button>
            </div>
        </div>
    );
};

export default MedicalSupplies;
