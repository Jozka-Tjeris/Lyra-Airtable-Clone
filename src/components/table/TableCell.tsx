import { useEffect, useState, useRef } from "react";

type TableCellProps = {
  value: string;
  onChange: (newValue: string) => void;
  onClick: () => void; // notify parent that this cell is active
  isActive?: boolean;
  onMoveNext?: () => void; // Tab / ArrowRight
  onMovePrev?: () => void; // Shift+Tab / ArrowLeft
  onMoveUp?: () => void;   // ArrowUp
  onMoveDown?: () => void; // ArrowDown
  cellId: string;
  registerRef?: (id: string, el: HTMLDivElement | null) => void;
};

export function TableCell({
  value,
  onChange,
  onClick,
  isActive = false,
  onMoveNext,
  onMovePrev,
  onMoveUp,
  onMoveDown,
  cellId,
  registerRef
}: TableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerRef?.(cellId, divRef.current);
    return () => registerRef?.(cellId, null);
  }, [cellId, registerRef]);

  const commit = () => {
    if (!isEditing) return;
    setIsEditing(false);
    if (localValue !== value) onChange(localValue);
  };

  const cancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement | HTMLInputElement>) => {
    if (isEditing) {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        commit();
      } 
      else if (e.key === "Escape") {
        e.preventDefault();
        cancel(); 
        setTimeout(() => {
          divRef.current?.focus();
        }, 0);
      } 
      else if (e.key === "Tab") {
        e.preventDefault();
        commit();
        if (e.shiftKey) onMovePrev?.();
        else onMoveNext?.();
      }
    } else if (isActive) {
      // Prevent default scrolling for navigation keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
        e.preventDefault();
      }
      switch (e.key) {
        case "Tab":
          //don't blur self here as this loses focus on table
          cancel();
          if (e.shiftKey) onMovePrev?.();
          else onMoveNext?.();
          break;
        case "Enter":
          setIsEditing(true);
          break;
        case "ArrowRight": onMoveNext?.(); break;
        case "ArrowLeft":  onMovePrev?.(); break;
        case "ArrowUp":    onMoveUp?.();   break;
        case "ArrowDown":  onMoveDown?.(); break;
      }
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        className="w-full px-2 py-1 border border-blue-500 outline-none"
        style={{ minWidth: 0 }}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        autoFocus
      />
    );
  }

  const handleClick = () => {
    if (!isActive) onClick(); // select if not active
    else setIsEditing(true);   // enter edit if already active
  };

  return (
    <div
      ref={divRef}       // needed for focusing
      tabIndex={0}       // makes div focusable
      className={`
        w-full px-2 py-1 truncate cursor-text hover:bg-gray-50 
        ${isActive ? "outline outline-2 outline-blue-500" : "border"}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {value}
    </div>
  );
}
