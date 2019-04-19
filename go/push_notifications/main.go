package main

import (
	"fmt"

	"github.com/anachronistic/apns"
)

func main() {

	send := make(chan Notification)

	go func() {
		server := NewServer("server_88bb56ce30a09e547450d9dc84e55716")
		if err := server.Run(send); err != nil {
			panic(err)
		}
	}()

	apnsClient := apns.NewClient("gateway.sandbox.push.apple.com:2195", "/Users/cbillett/Library/Mobile Documents/com~apple~CloudDocs/dfuse/eosqm/aps_development.pem", "/Users/cbillett/Library/Mobile Documents/com~apple~CloudDocs/dfuse/eosqm/aps_development-key.pem")

	for {
		notification := <-send

		payload := apns.NewPayload()
		payload.Alert = notification.Message
		payload.Badge = 1
		payload.Sound = "bingbong.aiff"

		pn := apns.NewPushNotification()
		pn.DeviceToken = notification.DeviceToken
		pn.AddPayload(payload)

		resp := apnsClient.Send(pn)

		alert, _ := pn.PayloadString()
		fmt.Println("  Alert:", alert)
		fmt.Println("Success:", resp.Success)
		fmt.Println("  Error:", resp.Error)
	}

}
