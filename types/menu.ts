export interface MenuOptionValue {
  id: string;
  name: string;
  extra_price: number;
}

export interface MenuOption {
  id: string;
  name: string;
  type: "select" | "multi";
  values: MenuOptionValue[];
}

export interface MenuProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  options: MenuOption[];
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
  products: MenuProduct[];
}
