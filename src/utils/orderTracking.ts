import type React from 'react';
import {
  PackageCheck,
  Truck,
  Bike,
  CheckCircle2,
} from 'lucide-react';
import type { OrderTrackingStepId } from '@/types';

export interface StepDefinition {
  id: OrderTrackingStepId;
  label: string;
  subLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  description: string;
  estimatedText: string;
}

export const TRACKING_STEPS: StepDefinition[] = [
  {
    id: 'ordered',
    label: 'Ordered',
    subLabel: 'Order Confirmed',
    icon: PackageCheck,
    description: 'Order placed & verified by AKSelling Seller Hub',
    estimatedText: 'Processed immediately',
  },
  {
    id: 'shipped',
    label: 'Shipped',
    subLabel: 'In Transit',
    icon: Truck,
    description: 'Dispatched from logistics warehouse via express carrier',
    estimatedText: 'Moving to regional hub',
  },
  {
    id: 'out_for_delivery',
    label: 'Out for Delivery',
    subLabel: 'Rider Assigned',
    icon: Bike,
    description: 'Delivery executive is out for doorstep delivery today',
    estimatedText: 'Expected today by 8:00 PM',
  },
  {
    id: 'delivered',
    label: 'Delivered',
    subLabel: 'Package Handed Over',
    icon: CheckCircle2,
    description: 'Delivered to recipient with digital signature & OTP verification',
    estimatedText: 'Completed',
  },
];

export function getStepIndexFromStatus(status: string | undefined): number {
  if (!status) return 0;
  const s = status.toLowerCase().trim();

  if (s.includes('deliver')) {
    return 3; // Delivered
  }
  if (
    s.includes('out') ||
    s.includes('delivery') ||
    s.includes('rider') ||
    s.includes('doorstep')
  ) {
    return 2; // Out for Delivery
  }
  if (s.includes('ship') || s.includes('transit') || s.includes('dispatch')) {
    return 1; // Shipped
  }
  // Placed / Ordered / Processing / Confirmed
  return 0; // Ordered
}

export function getStatusDisplayName(status: string | undefined): string {
  const index = getStepIndexFromStatus(status);
  return TRACKING_STEPS[index].label;
}
