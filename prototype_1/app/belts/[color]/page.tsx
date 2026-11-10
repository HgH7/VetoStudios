import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import products from '@/data/products.json';
import ProductPage from '@/components/ProductPage';

type BeltColor = keyof typeof products;
type PageProps = { params: Promise<{color:string}> };
const validColors=Object.keys(products) as BeltColor[];

export function generateStaticParams() { return validColors.map(color=>({color})); }

export async function generateMetadata({params}:PageProps):Promise<Metadata> {
 const {color}=await params;
 if(!validColors.includes(color as BeltColor))return {};
 const product=products[color as BeltColor];
 return {title:`VETO / ${product.name.en}`,description:`${product.name.en} VETO belt / EGP 1,900`};
}

export default async function BeltPage({params}:PageProps) {
 const {color}=await params;
 if(!validColors.includes(color as BeltColor))notFound();
 const beltColor=color as BeltColor;
 return <ProductPage color={beltColor} product={products[beltColor]}/>;
}
