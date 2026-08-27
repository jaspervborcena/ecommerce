export enum UserRolesEnum {
  CREATOR = 'creator',
  STORE_MANAGER = 'store_manager',
  CASHIER = 'cashier',
  GUEST = 'guest',
  REGISTERED_CUSTOMER = 'registered_customer',
  SUBSCRIBER = 'subscriber',
  SELLER = 'seller',
  STORE_OWNER = 'store_owner',
  PACKAGING_STAFF = 'packaging_staff',
  DELIVERY_DISPATCHER = 'delivery_dispatcher',
  DELIVERY_RIDER = 'delivery_rider',
  SUPPORT_AGENT = 'support_agent',
  MARKETING_MANAGER = 'marketing_manager',
  ADMIN = 'admin' // Tovrika admin - not shown in dropdown
}

export interface RoleOption {
  id: string;
  label: string;
  description: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    id: UserRolesEnum.CREATOR,
    label: 'Business Owner',
    description: 'Full access to all business features and settings'
  },
  {
    id: UserRolesEnum.STORE_MANAGER,
    label: 'Store Manager',
    description: 'Manage stores, products, and view business operations'
  },
  {
    id: UserRolesEnum.CASHIER,
    label: 'Cashier',
    description: 'Access POS system and process transactions'
  },
  {
    id: UserRolesEnum.GUEST,
    label: 'Guest',
    description: 'Browse and order without registration; limited tracking and loyalty'
  },
  {
    id: UserRolesEnum.REGISTERED_CUSTOMER,
    label: 'Registered Customer',
    description: 'Track orders, save favorites, and earn loyalty points'
  },
  {
    id: UserRolesEnum.SUBSCRIBER,
    label: 'Subscriber / Loyalty Member',
    description: 'Access exclusive deals, rewards, and tiered benefits'
  },
  {
    id: UserRolesEnum.SELLER,
    label: 'Seller / Merchant',
    description: 'Manage product listings, inventory, and pricing'
  },
  {
    id: UserRolesEnum.STORE_OWNER,
    label: 'Store Owner',
    description: 'Oversee operations, reports, and staff'
  },
  {
    id: UserRolesEnum.PACKAGING_STAFF,
    label: 'Packaging Staff',
    description: 'Prepare and pack orders while ensuring quality'
  },
  {
    id: UserRolesEnum.DELIVERY_DISPATCHER,
    label: 'Delivery Dispatcher',
    description: 'Assign orders to riders and optimize routes'
  },
  {
    id: UserRolesEnum.DELIVERY_RIDER,
    label: 'Delivery Rider / Driver',
    description: 'Pick up and deliver orders and update status'
  },
  {
    id: UserRolesEnum.SUPPORT_AGENT,
    label: 'Support Agent',
    description: 'Handle inquiries, complaints, and refunds'
  },
  {
    id: UserRolesEnum.MARKETING_MANAGER,
    label: 'Marketing Manager',
    description: 'Run promotions, loyalty programs, and notifications'
  }
];