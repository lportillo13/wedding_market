"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import type { VendorProfileDTO } from "@/types/vendor-profile";

type VendorContactProps = {
  vendor: VendorProfileDTO["vendor"];
};

type FormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  guest_count_range: string;
  message: string;
  event_date?: string;
  flexible: boolean;
  honeypot?: string;
};

type SubmitState = "idle" | "loading" | "success" | "error";

export default function VendorContact({ vendor }: VendorContactProps) {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: {
      flexible: false,
      guest_count_range: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (values.honeypot) {
      return;
    }
    setSubmitState("loading");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/rfqs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendor.id,
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          phone: values.phone || null,
          guest_count_range: values.guest_count_range,
          message: values.message,
          event_date: values.event_date || null,
          flexible: values.flexible,
        }),
      });

      const result = await response.json().catch(() => ({ ok: false, message: "Unexpected response." }));
      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || "Failed to send your request.");
      }
      setSubmitState("success");
      reset({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        guest_count_range: "",
        message: "",
        event_date: "",
        flexible: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setErrorMessage(message);
      setSubmitState("error");
    }
  });

  return (
    <div className="row g-4">
      <div className="col-12 col-lg-7">
        <h2 className="h3 mb-3">Request pricing & availability</h2>
        <p className="text-muted">
          Share a few details and {vendor.name} will reach out with tailored information.
        </p>

        {submitState === "success" ? (
          <div className="alert alert-success" role="status">
            Thanks! Your request has been sent. We&apos;ll be in touch soon.
          </div>
        ) : null}
        {submitState === "error" && errorMessage ? (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        ) : null}

        <form className="row g-3" onSubmit={onSubmit} noValidate>
          <input type="text" className="d-none" tabIndex={-1} autoComplete="off" {...register("honeypot")} />
          <div className="col-md-6">
            <label htmlFor="first_name" className="form-label">
              First name
            </label>
            <input
              id="first_name"
              type="text"
              className={`form-control ${formState.errors.first_name ? "is-invalid" : ""}`}
              {...register("first_name", { required: "Please enter your first name." })}
              required
            />
            {formState.errors.first_name ? (
              <div className="invalid-feedback">{formState.errors.first_name.message}</div>
            ) : null}
          </div>
          <div className="col-md-6">
            <label htmlFor="last_name" className="form-label">
              Last name
            </label>
            <input
              id="last_name"
              type="text"
              className={`form-control ${formState.errors.last_name ? "is-invalid" : ""}`}
              {...register("last_name", { required: "Please enter your last name." })}
              required
            />
            {formState.errors.last_name ? (
              <div className="invalid-feedback">{formState.errors.last_name.message}</div>
            ) : null}
          </div>
          <div className="col-md-6">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`form-control ${formState.errors.email ? "is-invalid" : ""}`}
              {...register("email", {
                required: "Please enter your email.",
                pattern: {
                  value: /.+@.+\..+/,
                  message: "Enter a valid email.",
                },
              })}
              required
            />
            {formState.errors.email ? <div className="invalid-feedback">{formState.errors.email.message}</div> : null}
          </div>
          <div className="col-md-6">
            <label htmlFor="phone" className="form-label">
              Phone (optional)
            </label>
            <input id="phone" type="tel" className="form-control" {...register("phone")} />
          </div>
          <div className="col-md-6">
            <label htmlFor="event_date" className="form-label">
              Event date
            </label>
            <input id="event_date" type="date" className="form-control" {...register("event_date")} />
            <div className="form-check mt-2">
              <input id="flexible" type="checkbox" className="form-check-input" {...register("flexible")} />
              <label htmlFor="flexible" className="form-check-label">
                Date is flexible
              </label>
            </div>
          </div>
          <div className="col-md-6">
            <label htmlFor="guest_count_range" className="form-label">
              Guest count range
            </label>
            <input
              id="guest_count_range"
              type="text"
              className={`form-control ${formState.errors.guest_count_range ? "is-invalid" : ""}`}
              placeholder="e.g. 100-150"
              {...register("guest_count_range", { required: "Let us know your estimated guest count." })}
              required
            />
            {formState.errors.guest_count_range ? (
              <div className="invalid-feedback">{formState.errors.guest_count_range.message}</div>
            ) : null}
          </div>
          <div className="col-12">
            <label htmlFor="message" className="form-label">
              Message
            </label>
            <textarea
              id="message"
              className={`form-control ${formState.errors.message ? "is-invalid" : ""}`}
              rows={5}
              placeholder="Share your vision, must-haves, or questions for the vendor."
              {...register("message", { required: "Please include a short message." })}
              required
            />
            {formState.errors.message ? (
              <div className="invalid-feedback">{formState.errors.message.message}</div>
            ) : null}
          </div>
          <div className="col-12">
            <button className="btn btn-primary btn-lg" type="submit" disabled={submitState === "loading"}>
              {submitState === "loading" ? "Sending..." : "Send request"}
            </button>
          </div>
        </form>
      </div>
      <div className="col-12 col-lg-5">
        <aside className="bg-light border rounded p-4 h-100">
          <h3 className="h5">Vendor details</h3>
          <ul className="list-unstyled small mb-0">
            {vendor.phone ? (
              <li className="mb-2">
                <strong>Phone:</strong> <a href={`tel:${vendor.phone}`}>{vendor.phone}</a>
              </li>
            ) : null}
            {vendor.websiteUrl ? (
              <li className="mb-2">
                <strong>Website:</strong>{" "}
                <a href={vendor.websiteUrl} target="_blank" rel="noreferrer">
                  {vendor.websiteUrl}
                </a>
              </li>
            ) : null}
            {vendor.location.addressLabel ? (
              <li className="mb-2">
                <strong>Address:</strong> {vendor.location.addressLabel}
                {vendor.location.mapUrl ? (
                  <div>
                    <a href={vendor.location.mapUrl} target="_blank" rel="noreferrer">
                      View on map
                    </a>
                  </div>
                ) : null}
              </li>
            ) : null}
          </ul>
        </aside>
      </div>
    </div>
  );
}
