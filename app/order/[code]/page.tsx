interface Props {
  params: Promise<{ code: string }>;
}

export default async function OrderTrackingPage({ params }: Props) {
  const { code } = await params;
  return <div>Order {code}</div>;
}
