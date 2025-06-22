import React from 'react';
import ReactDOM from 'react-dom';
import './Mascot.css';

const idleLines = [
  "Budgie is here to help! 🐦",
  "Ready to cheer you on!",
  "Let's make budgeting fun!",
  "Tweet tweet! I'm watching your savings soar!",
  "Need a tip? Just add something!",
  "Budgie loves your smart moves!"
];

function getRandomIdleLine() {
  return idleLines[Math.floor(Math.random() * idleLines.length)];
}

const Mascot = ({ tip, visible }) => {
  const displayText = tip || getRandomIdleLine();
  return ReactDOM.createPortal(
    <div className="mascot-container">
      {displayText && (
        <div className="mascot-bubble mascot-bubble-static">
          <span>{displayText}</span>
        </div>
      )}
      <img
        src={process.env.PUBLIC_URL + '/budgie.png'}
        alt="Budgie Mascot"
        className="mascot-img"
        draggable={false}
      />
    </div>,
    document.body
  );
};

export default Mascot; 