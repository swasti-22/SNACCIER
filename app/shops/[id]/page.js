// app/shops/[id]/page.js
import React from 'react';
import ShopMenuClient from './ShopMenuClient';

export async function generateStaticParams() {
  return [
    { id: 'shop_smooz' },
    { id: 'shop_yogi99' },
    { id: 'shop_teapost' },
    { id: 'shop_murlidhar' },
    { id: 'shop_amul' },
    { id: 'shop_sweetspot' },
    { id: 'shop_dannys' }
  ];
}

export default async function ShopMenuPage({ params }) {
  return <ShopMenuClient params={params} />;
}
