package request

type CreateMonitorRequest struct {
	Name          string `json:"name" validate:"required,min=1,max=128"`
	Type          string `json:"type" validate:"required,oneof=HTTP TCP ICMP"`
	Target        string `json:"target" validate:"required,min=1,max=512"`
	Interval      int64  `json:"interval" validate:"required,min=5,max=86400"`
	Timeout       int64  `json:"timeout" validate:"required,min=1,max=120"`
	Enabled       *bool  `json:"enabled"`
	Confirmations *int64 `json:"confirmations" validate:"omitempty,min=1,max=20"`
}

type UpdateMonitorRequest struct {
	Name          *string `json:"name" validate:"omitempty,min=1,max=128"`
	Type          *string `json:"type" validate:"omitempty,oneof=HTTP TCP ICMP"`
	Target        *string `json:"target" validate:"omitempty,min=1,max=512"`
	Interval      *int64  `json:"interval" validate:"omitempty,min=5,max=86400"`
	Timeout       *int64  `json:"timeout" validate:"omitempty,min=1,max=120"`
	Enabled       *bool   `json:"enabled"`
	Confirmations *int64  `json:"confirmations" validate:"omitempty,min=1,max=20"`
}

type CreateNotificationRequest struct {
	Type    string `json:"type" validate:"required,oneof=telegram webhook"`
	Config  string `json:"config" validate:"required"`
	Enabled *bool  `json:"enabled"`
}

type UpdateNotificationRequest struct {
	Type    *string `json:"type" validate:"omitempty,oneof=telegram webhook"`
	Config  *string `json:"config" validate:"omitempty,min=2"`
	Enabled *bool   `json:"enabled"`
}

type CreateStatusPageRequest struct {
	Name   string `json:"name" validate:"required,min=1,max=128"`
	Slug   string `json:"slug" validate:"required,min=2,max=64"`
	Public *bool  `json:"public"`
}

type UpdateStatusPageRequest struct {
	Name   *string `json:"name" validate:"omitempty,min=1,max=128"`
	Slug   *string `json:"slug" validate:"omitempty,min=2,max=64"`
	Public *bool   `json:"public"`
}

type IDLinkRequest struct {
	ID int64 `json:"id" validate:"required,min=1"`
}
