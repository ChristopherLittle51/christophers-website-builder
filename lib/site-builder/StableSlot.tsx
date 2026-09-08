'use client';

import type { SlotComponent } from '@puckeditor/core';

/** Keep the slot boundary mounted when Puck regenerates its render callback. */
export function StableSlot({ render, ...props }: { render: SlotComponent } & NonNullable<Parameters<SlotComponent>[0]>) {
  // Puck 0.23's slot transform returns a fresh, hook-free render callback when
  // nested content changes. Using that callback as a JSX component type causes
  // React to unmount the entire drop zone. Invoke it under this stable type so
  // its underlying DropZone retains focus, selection and scroll on updates.
  return render(props);
}
