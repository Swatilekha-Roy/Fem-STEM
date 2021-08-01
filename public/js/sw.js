self.addEventListener('push', event => {
    const data = event.data.json();
  console.log("Hi in sw");
    self.registration.showNotification(data.title, {
      body: 'Please join room number 123',
    });
  });