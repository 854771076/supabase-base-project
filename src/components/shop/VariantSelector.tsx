import React, { useMemo } from 'react';
import { Space, Typography } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { ProductVariant, VariantOption } from './types';

const { Text } = Typography;

interface VariantSelectorProps {
    variantOptions: VariantOption[];
    variants: ProductVariant[];
    selectedAttributes: Record<string, string>;
    onAttributeChange: (optionName: string, value: string) => void;
    selectedVariant: ProductVariant | null;
}

export default function VariantSelector({
    variantOptions,
    variants,
    selectedAttributes,
    onAttributeChange,
    selectedVariant,
}: VariantSelectorProps) {
    // Check if a specific option value is available (has stock)
    const isOptionAvailable = (optionName: string, value: string): boolean => {
        const testAttributes = { ...selectedAttributes, [optionName]: value };
        return variants.some(variant => {
            const matches = Object.entries(testAttributes).every(
                ([key, val]) => variant.attributes[key] === val
            );
            return matches && variant.stock_quantity > 0 && variant.is_active;
        });
    };

    // Get price for a specific option value (lowest price variant matching that value)
    const getPriceForOption = (optionName: string, value: string): number | null => {
        const matching = variants.filter(v => v.attributes[optionName] === value && v.is_active);
        if (!matching.length) return null;
        return Math.min(...matching.map(v => v.price_cents));
    };

    // Check if all option values for this option have the same price
    const allSamePrice = useMemo(() => {
        const result: Record<string, boolean> = {};
        for (const option of variantOptions) {
            const prices = option.option_values
                .map(v => getPriceForOption(option.option_name, v))
                .filter((p): p is number => p !== null);
            result[option.option_name] = prices.length > 0 && new Set(prices).size === 1;
        }
        return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variantOptions, variants]);

    return (
        <div style={{ marginBottom: 24 }}>
            {variantOptions.map((option) => (
                <div key={option.id} style={{ marginBottom: 20 }}>
                    <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 15 }}>
                        {option.option_name}
                        {selectedAttributes[option.option_name] && (
                            <Text type="secondary" style={{ marginLeft: 8, fontWeight: 'normal' }}>
                                : {selectedAttributes[option.option_name]}
                            </Text>
                        )}
                    </Text>

                    <Space size={[8, 8]} wrap>
                        {option.option_values.map((value) => {
                            const isSelected = selectedAttributes[option.option_name] === value;
                            const isAvailable = isOptionAvailable(option.option_name, value);
                            const price = getPriceForOption(option.option_name, value);
                            const showPrice = price !== null && !allSamePrice[option.option_name];

                            return (
                                <button
                                    key={value}
                                    disabled={!isAvailable}
                                    onClick={() => onAttributeChange(option.option_name, value)}
                                    style={{
                                        minWidth: 80,
                                        height: 'auto',
                                        padding: showPrice ? '6px 14px' : '10px 14px',
                                        borderRadius: 8,
                                        border: isSelected ? '2px solid #1677ff' : '1px solid #d9d9d9',
                                        background: isSelected ? '#e6f4ff' : '#fff',
                                        color: isSelected ? '#1677ff' : isAvailable ? '#1a1a1a' : '#bfbfbf',
                                        fontWeight: isSelected ? 600 : 400,
                                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                                        opacity: isAvailable ? 1 : 0.45,
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 2,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {isSelected && <CheckOutlined style={{ fontSize: 12 }} />}
                                        {value}
                                    </span>
                                    {showPrice && (
                                        <span style={{ fontSize: 11, color: isSelected ? '#1677ff' : '#8c8c8c' }}>
                                            ${(price / 100).toFixed(2)}
                                        </span>
                                    )}
                                    {!isAvailable && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: 0,
                                            right: 0,
                                            height: 1,
                                            background: '#ff4d4f',
                                            transform: 'translateY(-50%) rotate(-15deg)',
                                            pointerEvents: 'none',
                                        }} />
                                    )}
                                </button>
                            );
                        })}
                    </Space>
                </div>
            ))}

            {selectedVariant && (
                <div style={{
                    marginTop: 16,
                    padding: '10px 14px',
                    background: '#f5f5f5',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        {selectedVariant.sku ? `SKU: ${selectedVariant.sku}` : Object.entries(selectedVariant.attributes).map(([k, v]) => `${k}: ${v}`).join(' / ')}
                    </Text>
                    <Text type={selectedVariant.stock_quantity > 0 ? 'success' : 'danger'} strong style={{ fontSize: 13 }}>
                        {selectedVariant.stock_quantity > 0
                            ? `${selectedVariant.stock_quantity} in stock`
                            : 'Out of stock'}
                    </Text>
                </div>
            )}
        </div>
    );
}
