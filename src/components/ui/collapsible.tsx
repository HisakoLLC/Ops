"use client";

import * as React from "react";

type CollapsibleContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open: openProp, defaultOpen = false, onOpenChange, children, ...props }, ref) => {
    const [openState, setOpenState] = React.useState(defaultOpen);
    const open = openProp !== undefined ? openProp : openState;

    const handleOpenChange = React.useCallback(
      (newOpen: boolean) => {
        setOpenState(newOpen);
        onOpenChange?.(newOpen);
      },
      [onOpenChange]
    );

    return (
      <CollapsibleContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
        <div ref={ref} data-state={open ? "open" : "closed"} {...props}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);
Collapsible.displayName = "Collapsible";

export type CollapsibleTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ onClick, children, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext);
    if (!context) throw new Error("CollapsibleTrigger must be used within Collapsible");

    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={context.open}
        data-state={context.open ? "open" : "closed"}
        onClick={(e) => {
          context.onOpenChange(!context.open);
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
CollapsibleTrigger.displayName = "CollapsibleTrigger";

export type CollapsibleContentProps = React.HTMLAttributes<HTMLDivElement>;

export const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ children, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext);
    if (!context) throw new Error("CollapsibleContent must be used within Collapsible");

    if (!context.open) return null;

    return (
      <div ref={ref} data-state={context.open ? "open" : "closed"} {...props}>
        {children}
      </div>
    );
  }
);
CollapsibleContent.displayName = "CollapsibleContent";
