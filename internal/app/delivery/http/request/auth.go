package request

type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Username string `json:"username" validate:"required,min=3,max=32"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginRequest struct {
	Login    string `json:"login" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type UpdateMeRequest struct {
	Email            *string `json:"email" validate:"omitempty,email"`
	Username         *string `json:"username" validate:"omitempty,min=3,max=32"`
	Password         *string `json:"password" validate:"omitempty,min=8"`
	CurrentPassword  *string `json:"current_password" validate:"omitempty,min=1"`
	RegenerateAPIKey *bool   `json:"regenerate_api_key"`
}
