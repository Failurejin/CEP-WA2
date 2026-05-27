# CEP-WA2
CEP WA2
# Relativistic Particle Physics Simulator

An interactive physics simulation built with p5.js, combining Newtonian gravity, Coulomb electrostatics, and special relativistic time dilation.

## 🚀 Try It Out!
https://failurejin.github.io/CEP-WA2/

## 🎮 Controls

### Mouse
| Action | Effect |
|--------|--------|
| Left click on empty space | Spawn particle (current charge mode) |
| Left drag on object | Drag and throw particle |
| Click on sidebar menu | Lock/unlock camera tracking target |

### Keyboard
| Key | Effect |
|-----|--------|
| `P` | Toggle charge mode (Positive/Negative) |
| `N` | Toggle neutral mode |
| `S` | Toggle vector field display |
| `G` | Toggle gravity field warp display |
| `+` / `=` | Increase force constants G and K |
| `-` / `_` | Decrease force constants G and K |
| `B` | Spawn black hole at mouse position |
| `O` | Spawn binary star system at mouse position |
| `R` | Reset all particles and camera |
| `←` `→` `↑` `↓` | Pan camera |

### Scroll Wheel
- **Scroll**: Zoom in/out

## 🔬 Physics & Science Lens

This simulation models three interconnected physical phenomena:

1. **Newtonian Gravity** - F = G·m₁m₂/r²
2. **Coulomb Electrostatics** - F = K·q₁q₂/r²  
3. **Special Relativity (Time Dilation)** - Lorentz factor γ = 1/√(1-v²/c²)

The **"Science Lens" is the Relativistic Frame of Reference**: When locking onto any object as an observer, all other particles experience time dilation based on their relative velocity. Local clock percentages are displayed for every object.

## ✨ Creative Features

- **Drag-and-throw interaction** - Drag any particle and release to "throw" it
- **Gravitational lensing visualization** - Grid lines bend around massive objects
- **Real-time clock display** - Each object shows its local time flow percentage
- **Binary star system spawn** - Auto-calculates orbital velocity
- **Black hole generation** - Mass 10000 neutral object with strong lensing effect
- **Smart camera tracking** - Auto-zoom and follow when locking onto objects

## 🛠️ Technical Implementation

- **Force calculation**: O(N²) pairwise summation of gravity + electrostatic forces
- **Relativistic integrator**: 4-momentum p = γmv integration
- **Collision system**: Mass/charge/momentum conservation with trail merging
- **Camera system**: World-to-screen coordinate transformation with pan/zoom/lock

## 📁 File Structure
CEP-WA2/
├── index.html # Main page
├── sketch.js # Main sketch + global functions
├── Mover.js # Mover class (particles)
├── style.css # Styling
├── p5.js # p5.js library
└── p5.sound.min.js # p5 sound library (optional)

## 🎥 Demo Video
https://youtu.be/LHckYjDIhqY

## 📚 Acknowledgments
- **The Nature of Code (Daniel Shiffman)** - Force and particle system architecture
- **AI assistance** - Gemini helped debug camera coordinate transform and dt parameter passing

## 👤 Author

Jin Huichuan - CEP WA2 Assignment

## 📅 Date

May 2026
