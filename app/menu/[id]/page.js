// app/menu/[id]/page.js
import React from 'react';
import ShopMenuClient from '@/app/shops/[id]/ShopMenuClient';

export async function generateStaticParams() {
  return [
    { id: 'shop_yogi99' },
    { id: 'shop_amul' },
    { id: 'shop_sweetspot' },
    { id: 'shop_dannys' }
  ];
}

export default async function MenuPage({ params }) {
  return <ShopMenuClient params={params} />;
}
