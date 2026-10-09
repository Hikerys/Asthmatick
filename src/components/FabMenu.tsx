import React from "react";
import { InhalerIcon, AttackIcon, NoteIcon, ChevronRightIcon } from "./Icons";
import { ModalSheet } from "./ModalSheet";

interface FabMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: "schedule" | "attack" | "note") => void;
}

export function FabMenu({ isOpen, onClose, onSelectOption }: FabMenuProps) {
  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <h3>Что вы хотите добавить?</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "8px" }}>
        {/* Option 1: Schedule */}
        <button
          type="button"
          className="opt tap"
          onClick={() => {
            onClose();
            onSelectOption("schedule");
          }}
        >
          <div className="ic b">
            <InhalerIcon size={26} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)" }}>
              Событие в расписание
            </div>
            <div style={{ fontSize: "13px", color: "var(--sub)", marginTop: "2px" }}>
              Настройка времени и дней недели приёма
            </div>
          </div>
          <ChevronRightIcon />
        </button>

        {/* Option 2: Attack */}
        <button
          type="button"
          className="opt tap"
          onClick={() => {
            onClose();
            onSelectOption("attack");
          }}
        >
          <div className="ic p">
            <AttackIcon size={26} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)" }}>
              Приступ / Состояние
            </div>
            <div style={{ fontSize: "13px", color: "var(--sub)", marginTop: "2px" }}>
              Выбор тяжести и фиксация времени
            </div>
          </div>
          <ChevronRightIcon />
        </button>

        {/* Option 3: Note */}
        <button
          type="button"
          className="opt tap"
          onClick={() => {
            onClose();
            onSelectOption("note");
          }}
        >
          <div className="ic g">
            <NoteIcon size={26} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)" }}>
              Простая заметка
            </div>
            <div style={{ fontSize: "13px", color: "var(--sub)", marginTop: "2px" }}>
              Самочувствие, комментарий, пикфлоуметрия
            </div>
          </div>
          <ChevronRightIcon />
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="btn-secondary"
      >
        Отмена
      </button>
    </ModalSheet>
  );
}
