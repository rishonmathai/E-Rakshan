from channels.generic.websocket import AsyncJsonWebsocketConsumer
class EventsConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send_json({"type":"connected","message":"E-Rakshan event stream connected"})
    async def receive_json(self, content, **kwargs):
        await self.send_json({"type":"ack","received":content})
