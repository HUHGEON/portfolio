"use client";

import {
  type FocusEvent,
  type ReactElement,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type TooltipPlacement = "top" | "right" | "bottom" | "left";

type TooltipProps = {
  children: ReactElement;
  content: string;
  placement?: TooltipPlacement;
  className?: string;
  disableCollision?: boolean;
};

const tooltipGap = 8;
const viewportMargin = 8;

export function Tooltip({
  children,
  content,
  placement = "top",
  className = "",
  disableCollision = false,
}: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;

    if (!trigger || !tooltip) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const resolvedPlacement = disableCollision
      ? placement
      : resolvePlacement(
          placement,
          triggerRect,
          tooltipRect,
          window.innerWidth,
          window.innerHeight,
        );
    const nextPosition = getTooltipPosition(
      resolvedPlacement,
      triggerRect,
      tooltipRect,
    );

    setPosition({
      top: disableCollision
        ? nextPosition.top
        : clamp(
            nextPosition.top,
            viewportMargin,
            window.innerHeight - tooltipRect.height - viewportMargin,
          ),
      left: disableCollision
        ? nextPosition.left
        : clamp(
            nextPosition.left,
            viewportMargin,
            window.innerWidth - tooltipRect.width - viewportMargin,
          ),
    });
  }, [disableCollision, placement]);

  useLayoutEffect(() => {
    if (!visible) {
      return;
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [updatePosition, visible]);

  const handleBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setVisible(false);
    }
  };

  return (
    <>
      <span
        ref={triggerRef}
        className={`inline-flex ${className}`}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClickCapture={() => setVisible(false)}
        onFocusCapture={() => setVisible(true)}
        onBlurCapture={handleBlur}
      >
        {children}
      </span>
      {visible && typeof document !== "undefined"
        ? createPortal(
            <span
              ref={tooltipRef}
              role="tooltip"
              style={{ top: position.top, left: position.left }}
              className="pointer-events-none fixed z-[100] max-w-56 rounded-md bg-zinc-950 px-2 py-1 text-xs font-medium text-white shadow-lg"
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}

function resolvePlacement(
  placement: TooltipPlacement,
  trigger: DOMRect,
  tooltip: DOMRect,
  viewportWidth: number,
  viewportHeight: number,
): TooltipPlacement {
  if (
    placement === "top" &&
    trigger.top - tooltip.height - tooltipGap < viewportMargin
  ) {
    return "bottom";
  }

  if (
    placement === "bottom" &&
    trigger.bottom + tooltip.height + tooltipGap > viewportHeight - viewportMargin
  ) {
    return "top";
  }

  if (
    placement === "left" &&
    trigger.left - tooltip.width - tooltipGap < viewportMargin
  ) {
    return "right";
  }

  if (
    placement === "right" &&
    trigger.right + tooltip.width + tooltipGap > viewportWidth - viewportMargin
  ) {
    return "left";
  }

  return placement;
}

function getTooltipPosition(
  placement: TooltipPlacement,
  trigger: DOMRect,
  tooltip: DOMRect,
) {
  const centeredLeft = trigger.left + (trigger.width - tooltip.width) / 2;
  const centeredTop = trigger.top + (trigger.height - tooltip.height) / 2;

  return {
    top: { top: trigger.top - tooltip.height - tooltipGap, left: centeredLeft },
    right: { top: centeredTop, left: trigger.right + tooltipGap },
    bottom: { top: trigger.bottom + tooltipGap, left: centeredLeft },
    left: { top: centeredTop, left: trigger.left - tooltip.width - tooltipGap },
  }[placement];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
