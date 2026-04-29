const robot = require('robotjs');

robot.setMouseDelay(1);
robot.setKeyboardDelay(1);

const heldKeys = new Set();

async function handleInput(msg, screenWidth, screenHeight) {
  try {
    switch (msg.type) {
      case 'mousemove': {
        const x = Math.round(msg.x * screenWidth);
        const y = Math.round(msg.y * screenHeight);
        robot.moveMouse(x, y);
        // Log cada 50 movimientos
        if (Math.random() < 0.02) {
          console.log(`[Input] Mouse: (${msg.x.toFixed(3)}, ${msg.y.toFixed(3)}) → (${x}, ${y}) [screen: ${screenWidth}x${screenHeight}]`);
        }
        break;
      }
      case 'mousedown': {
        const btn = msg.button === 2 ? 'right' : msg.button === 1 ? 'middle' : 'left';
        robot.mouseToggle('down', btn);
        break;
      }
      case 'mouseup': {
        const btn = msg.button === 2 ? 'right' : msg.button === 1 ? 'middle' : 'left';
        robot.mouseToggle('up', btn);
        break;
      }
      case 'wheel': {
        const dir = msg.deltaY > 0 ? 'down' : 'up';
        robot.scrollMouse(0, msg.deltaY > 0 ? -3 : 3);
        break;
      }
      case 'keydown': {
        const k = mapKeyName(msg.key);
        const modifiers = collectActiveModifiers(msg.key);

        if (k) {
          heldKeys.add(k);
          try {
            if (modifiers.length > 0) {
              robot.keyToggle(k, 'down', modifiers);
            } else {
              robot.keyToggle(k, 'down');
            }
          } catch (err) {
            console.warn('[Input] keyToggle error:', err.message);
          }
        } else if (msg.key.length === 1) {
          // Char printable — usar typeString si no hay modifiers
          if (modifiers.length === 0) {
            robot.typeString(msg.key);
          } else {
            // Si hay Ctrl/Alt activos, usar la tecla directamente
            try {
              robot.keyTap(msg.key.toLowerCase(), modifiers);
            } catch (err) {
              robot.typeString(msg.key);
            }
          }
        }
        break;
      }
      case 'keyup': {
        const k = mapKeyName(msg.key);
        if (k && heldKeys.has(k)) {
          heldKeys.delete(k);
          try {
            robot.keyToggle(k, 'up');
          } catch {}
        }
        break;
      }
    }
  } catch (err) {
    console.error('[Input]', err.message);
  }
}

function collectActiveModifiers(currentKey) {
  const mods = [];
  if (heldKeys.has('control') && currentKey !== 'Control') mods.push('control');
  if (heldKeys.has('alt') && currentKey !== 'Alt') mods.push('alt');
  if (heldKeys.has('shift') && currentKey !== 'Shift') mods.push('shift');
  if (heldKeys.has('command') && currentKey !== 'Meta') mods.push('command');
  return mods;
}

function mapKeyName(key) {
  const map = {
    Enter: 'enter',
    Backspace: 'backspace',
    Tab: 'tab',
    Escape: 'escape',
    Delete: 'delete',
    Insert: 'insert',
    Home: 'home',
    End: 'end',
    PageUp: 'pageup',
    PageDown: 'pagedown',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    F1: 'f1', F2: 'f2', F3: 'f3', F4: 'f4',
    F5: 'f5', F6: 'f6', F7: 'f7', F8: 'f8',
    F9: 'f9', F10: 'f10', F11: 'f11', F12: 'f12',
    Control: 'control',
    Alt: 'alt',
    Shift: 'shift',
    Meta: 'command',
    CapsLock: 'caps_lock',
    ' ': 'space',
  };
  return map[key] || null;
}

module.exports = { handleInput };
