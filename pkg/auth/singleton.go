package auth

import (
	"errors"
	"fmt"
	"sync"
)

var apikeyclient *Auth
var jwtclient *Auth
var clientOnce sync.Once

func CreateAuthManager(jwtSecret, apiKey *string) error {
	var err error
	clientOnce.Do(func() {
		if jwtSecret != nil {
			jwtclient, err = New(Config{
				Type:      TypeJWT,
				JWTSecret: *jwtSecret,
			})
		}

		if apiKey != nil {
			apikeyclient, err = New(Config{
				Type:   TypeAPIKey,
				APIKey: *apiKey,
			})
		}
	})

	if err != nil {
		return errors.New(fmt.Sprintf("auth jwt client: %s", err.Error()))
	}
	return nil
}

func GetAuthManager(p Type) *Auth {
	switch p {
	case TypeAPIKey:
		return apikeyclient
	case TypeJWT:
		return jwtclient
	default:
		return nil
	}
}
