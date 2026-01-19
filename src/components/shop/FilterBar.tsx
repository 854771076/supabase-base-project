'use client';

import React from 'react';
import { Row, Col, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslations } from '@/i18n/context';
import { Category } from './types';

interface FilterBarProps {
    search: string;
    onSearchChange: (value: string) => void;
    selectedCategory: string | null;
    onCategoryChange: (value: string | null) => void;
    categories: Category[];
}

export default function FilterBar({
    search,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    categories
}: FilterBarProps) {
    const t = useTranslations('Shop');

    return (
        <div className="filter-bar">
            <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={10} lg={8}>
                    <Input
                        placeholder={t('searchPlaceholder')}
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        allowClear
                        size="large"
                        className="custom-search"
                    />
                </Col>
                <Col xs={24} md={8} lg={6}>
                    <Select
                        placeholder={t('allCategories')}
                        value={selectedCategory}
                        onChange={onCategoryChange}
                        allowClear
                        size="large"
                        style={{ width: '100%' }}
                        className="custom-select"
                    >
                        {categories.map(cat => (
                            <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
                        ))}
                    </Select>
                </Col>
            </Row>
        </div>
    );
}
