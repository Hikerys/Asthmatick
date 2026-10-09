import React, { useEffect, useRef, useState } from "react";
import { registerBackHandler } from "../navigation";

interface ModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  sheetStyle?: React.CSSProperties;
  showGrab?: boolean;
  zIndex?: number;
}

export function ModalSheet({
  isOpen,
  onClose,
  children,
  className = "",
  sheetStyle,
  showGrab = true,
  zIndex,
}: ModalSheetProps) {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isActive, setIsActive] = useState(false);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  // Gesture tracking refs
  const dragStartYRef = useRef(0);
  const dragStartXRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Handle opening / closing state transitions
  useEffect(() => {
    let timer: number | undefined;

    if (isOpen) {
      setIsRendered(true);
      // Wait for next frame so the DOM node exists with initial transform
      const rAF = requestAnimationFrame(() => {
        timer = window.setTimeout(() => {
          setIsActive(true);
        }, 16);
      });
      return () => {
        cancelAnimationFrame(rAF);
        clearTimeout(timer);
      };
    } else {
      setIsActive(false);
      // Reset inline styles if any
      if (sheetRef.current) {
        sheetRef.current.style.transform = "";
        sheetRef.current.style.transition = "";
      }
      if (overlayRef.current) {
        overlayRef.current.style.opacity = "";
        overlayRef.current.style.transition = "";
      }
      // Unmount after transition finishes (320ms)
      timer = window.setTimeout(() => {
        setIsRendered(false);
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Register back handler while open
  useEffect(() => {
    if (!isOpen) return;
    return registerBackHandler(() => {
      onClose();
      return true;
    });
  }, [isOpen, onClose]);

  // Animate down and close
  const animateAndClose = () => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = "transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)";
      sheetRef.current.style.transform = "translateY(100%)";
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = "opacity 0.28s ease";
      overlayRef.current.style.opacity = "0";
    }
    setTimeout(() => {
      onClose();
    }, 180);
  };

  // Touch handlers for the grab island & top header
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartYRef.current = e.touches[0].clientY;
    dragStartXRef.current = e.touches[0].clientX;
    dragStartTimeRef.current = Date.now();
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !sheetRef.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartYRef.current;

    if (deltaY > 0) {
      // Pulling down: track finger 1:1
      sheetRef.current.style.transition = "none";
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      if (overlayRef.current) {
        const opacity = Math.max(0, 1 - deltaY / 380);
        overlayRef.current.style.opacity = `${opacity}`;
        overlayRef.current.style.transition = "none";
      }
    } else {
      // Elastic resistance when dragging upwards
      const resist = deltaY * 0.2;
      sheetRef.current.style.transform = `translateY(${resist}px)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !sheetRef.current) return;
    isDraggingRef.current = false;

    const touch = e.changedTouches[0];
    const deltaY = touch.clientY - dragStartYRef.current;
    const deltaX = touch.clientX - dragStartXRef.current;
    const elapsed = Date.now() - dragStartTimeRef.current;
    const velocityY = deltaY / Math.max(elapsed, 1);

    // 1. Check if user swiped right horizontally (back gesture)
    if (deltaX > 75 && deltaX > Math.abs(deltaY) * 1.4 && elapsed < 450) {
      animateAndClose();
      return;
    }

    // 2. Check if user swiped down or pulled down past threshold
    if (deltaY > 70 || (deltaY > 25 && velocityY > 0.38)) {
      animateAndClose();
    } else {
      // Snap back to open position
      sheetRef.current.style.transition = "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)";
      sheetRef.current.style.transform = "";
      if (overlayRef.current) {
        overlayRef.current.style.transition = "opacity 0.25s ease";
        overlayRef.current.style.opacity = "";
      }
    }
  };

  // If user simply clicks/taps the grab island, close smoothly as well
  const handleGrabClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  if (!isRendered) return null;

  return (
    <div
      ref={overlayRef}
      className={`ov ${isActive ? "on" : ""} ${className}`}
      style={zIndex ? { zIndex } : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={sheetRef}
        className="sheet"
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {showGrab && (
          <div
            className="grab-area"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onClick={handleGrabClick}
            title="Смахните вниз для закрытия"
          >
            <div className="grab" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
