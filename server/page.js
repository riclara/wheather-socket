export default `
<html>
<head>
  <title>WS example</title>
</head>

<body>
  <h2>Socket message response: </h2>
  <pre id="response"></pre>
  
  <script>
  // Extremely simplified here, no error handling or anything
document.body.onload = function() {

    'use strict';
  let flag = true
  // First the socket requesta
  function socketExample() {
    console.log('Creating socket: ', window.location.port);
    const protocol = window.location.protocol
    const protocolw = protocolw === 'https' ? 'wss' : 'ws'
    let socket = new WebSocket(protocolw + '://' + window.location.hostname + ':' + window.location.port + '/weather');
    socket.onopen = function() {
      console.log('Socket open.')
      rec(socket)
      
    };
    socket.onmessage = function(message) {
      console.log('Socket server message', message.data)
      let oldTable = document.getElementById('table')
      if(oldTable) {
        document.getElementById('response').removeChild(oldTable)
      }
      let data = JSON.parse(message.data)
      let table = document.createElement('table')
      table.setAttribute('id', 'table')
      data.forEach(element => {
        addRows(table, element.timezone, element.hora, element.temperatura) 
      })
      addRows(table, 'timezone', 'hora', 'temperatura')
      document.getElementById('response').appendChild(table)
    };
  }

  function addRows(table, val1, val2, val3) {
    let c, r
    r = table.insertRow(0)
    c = r.insertCell(0)
    c.style.paddingRight = '30px'
    c.innerHTML = val1
    c = r.insertCell(1)
    c.style.paddingRight = '30px'
    c.innerHTML = val2
    c = r.insertCell(2)
    c.innerHTML = val3
  }

  // Call them both;
  function rec (socket) {
    socket.send('message')
    console.log('Message sent.')
    setTimeout(() => {
      rec(socket)
    }, 10000);
  }

  socketExample();
}
  </script>
</body>
</html>
`
