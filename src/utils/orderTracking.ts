import type { LucideIcon } from 'lucide-react';
import {
  PackageCheck,
  Package,
  Truck,
  Bike,
  CheckCircle2,
} from 'lucide-react';
import type { OrderTrackingStepId } from '@/types';

export interface StepDefinition {
  id: OrderTrackingStepId;
  label: string;
  subLabel: string;
  icon: LucideIcon;
  description: string;
  estimatedText: string;
}

export const TRACKING_STEPS: StepDefinition[] = [
  {
    id: 'placed',
    label: 'Order Placed',
    subLabel: 'Confirmed',
    icon: PackageCheck,
    description: 'Order placed & verified by AKSelling Seller Hub',
    estimatedText: 'Processed immediately',
  },
  {
    id: 'packed',
    label: 'Packed',
    subLabel: 'Ready to Ship',
    icon: Package,
    description: 'Item securely packed & sealed at fulfillment hub',
    estimatedText: 'Quality inspected & labeled',
  },
  {
    id: 'shipped',
    label: 'Shipped',
    subLabel: 'In Transit',
    icon: Truck,
    description: 'Dispatched from logistics warehouse via express carrier',
    estimatedText: 'Moving to regional delivery hub',
  },
  {
    id: 'out_for_delivery',
    label: 'Out for Delivery',
    subLabel: 'Arriving Today',
    icon: Bike,
    description: 'Delivery executive is en route for doorstep delivery',
    estimatedText: 'Expected today by 8:00 PM',
  },
  {
    id: 'delivered',
    label: 'Delivered',
    subLabel: 'Completed',
    icon: CheckCircle2,
    description: 'Delivered to recipient with digital signature & OTP verification',
    estimatedText: 'Delivered safely',
  },
];

export function getStepIndexFromStatus(status: string | undefined): number {
  if (!status) return 0;
  const s = status.toLowerCase().trim();

  if (s.includes('deliver')) {
    return 4; // Delivered
  }
  if (
    s.includes('out') ||
    s.includes('doorstep') ||
    s.includes('rider') ||
    s.includes('arriving')
  ) {
    return 3; // Out for Delivery
  }
  if (s.includes('ship') || s.includes('transit') || s.includes('dispatch')) {
    return 2; // Shipped
  }
  if (s.includes('pack') || s.includes('box') || s.includes('manifest')) {
    return 1; // Packed
  }
  // Placed / Ordered / Processing / Confirmed / Pending
  return 0; // Order Placed
}

export function getStatusDisplayName(status: string | undefined): string {
  const index = getStepIndexFromStatus(status);
  return TRACKING_STEPS[index]?.label || 'Order Placed';
}

