'use client';

import React, { useRef, useState } from 'react';
import { Carousel, Image as AntImage } from 'antd';
import type { CarouselRef } from 'antd/es/carousel';
import { ShoppingCartOutlined } from '@ant-design/icons';

interface ProductGalleryProps {
    images: string[];
    productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
    const carouselRef = useRef<CarouselRef>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    return (
        <div className="gallery-section">
            <div className="main-carousel-wrapper">
                {images.length > 0 ? (
                    <Carousel
                        ref={carouselRef}
                        dots={false}
                        afterChange={(current) => setActiveImageIndex(current)}
                        effect="fade"
                    >
                        {images.map((img, index) => (
                            <div key={index} className="image-slide">
                                <AntImage
                                    src={img}
                                    alt={`${productName} - ${index + 1}`}
                                    preview={{ mask: '点击放大查看' }}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>
                        ))}
                    </Carousel>
                ) : (
                    <div className="empty-image">
                        <ShoppingCartOutlined style={{ fontSize: '64px', color: '#f0f0f0' }} />
                    </div>
                )}
            </div>

            {images.length > 1 && (
                <div className="thumbnails-wrapper">
                    {images.map((img, index) => (
                        <div
                            key={index}
                            className={`thumb-item ${activeImageIndex === index ? 'active' : ''}`}
                            onClick={() => carouselRef.current?.goTo(index)}
                        >
                            <img src={img} alt="thumbnail" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
